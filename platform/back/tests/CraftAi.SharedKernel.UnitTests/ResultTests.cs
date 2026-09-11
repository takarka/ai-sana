namespace CraftAi.SharedKernel.UnitTests;

public sealed class ResultTests
{
    [Fact]
    public void Success_НесётЗначениеИНеСодержитОшибку()
    {
        var result = Result.Success(42);

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Equal(42, result.Value);
        Assert.Null(result.Error);
    }

    [Fact]
    public void Failure_НесётОшибкуИЗапрещаетЧтениеЗначения()
    {
        var error = Error.NotFound("org.not-found", "Организация не найдена.");
        var result = Result.Failure<int>(error);

        Assert.True(result.IsFailure);
        Assert.Equal(error, result.Error);
        Assert.Throws<InvalidOperationException>(() => result.Value);
    }

    [Fact]
    public void ImplicitOperator_ОборачиваетЗначениеВУспешныйРезультат()
    {
        Result<string> result = "школа №1";

        Assert.True(result.IsSuccess);
        Assert.Equal("школа №1", result.Value);
    }

    [Theory]
    [InlineData(ErrorType.Validation)]
    [InlineData(ErrorType.NotFound)]
    [InlineData(ErrorType.Conflict)]
    [InlineData(ErrorType.Forbidden)]
    [InlineData(ErrorType.Unauthorized)]
    [InlineData(ErrorType.Failure)]
    public void ФабрикиError_ПроставляютСоответствующийТип(ErrorType expectedType)
    {
        var error = expectedType switch
        {
            ErrorType.Validation => Error.Validation("code", "message"),
            ErrorType.NotFound => Error.NotFound("code", "message"),
            ErrorType.Conflict => Error.Conflict("code", "message"),
            ErrorType.Forbidden => Error.Forbidden("code", "message"),
            ErrorType.Unauthorized => Error.Unauthorized("code", "message"),
            _ => Error.Failure("code", "message"),
        };

        Assert.Equal(expectedType, error.Type);
    }
}
